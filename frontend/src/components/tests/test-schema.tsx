/**
 * Test schema display component
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import type { TestCase } from '@/types/api'

interface TestSchemaProps {
  test: TestCase
}

export function TestSchema({ test }: TestSchemaProps) {
  const [copiedInput, setCopiedInput] = useState(false)
  const [copiedOutput, setCopiedOutput] = useState(false)

  const copyToClipboard = (text: string, type: 'input' | 'output') => {
    navigator.clipboard.writeText(text)
    if (type === 'input') {
      setCopiedInput(true)
      setTimeout(() => setCopiedInput(false), 2000)
    } else {
      setCopiedOutput(true)
      setTimeout(() => setCopiedOutput(false), 2000)
    }
  }

  const renderSchema = (schema: any) => {
    if (!schema) return 'No schema defined'
    return JSON.stringify(schema, null, 2)
  }

  const getPropertyBadge = (property: any) => {
    const type = property.type || 'unknown'
    const isRequired = property.required || false
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {type}
        </Badge>
        {isRequired && (
          <Badge variant="destructive" className="text-xs">
            Required
          </Badge>
        )}
      </div>
    )
  }

  const renderSchemaProperties = (schema: any) => {
    if (!schema?.properties) return null

    return (
      <div className="space-y-3">
        {Object.entries(schema.properties).map(([key, property]: [string, any]) => (
          <div key={key} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <code className="font-medium">{key}</code>
              {getPropertyBadge(property)}
            </div>
            {property.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {property.description}
              </p>
            )}
            {property.enum && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Values:</span>
                {property.enum.map((value: string) => (
                  <Badge key={value} variant="outline" className="text-xs">
                    {value}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Schema */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Input Schema</CardTitle>
              <CardDescription>
                Structure of input data for this test
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(renderSchema(test.input_schema), 'input')}
            >
              {copiedInput ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {test.input_schema ? (
            <>
              {/* Visual representation */}
              {renderSchemaProperties(test.input_schema)}
              
              {/* Raw JSON */}
              <div>
                <h4 className="font-medium mb-2">Raw Schema</h4>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {renderSchema(test.input_schema)}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No input schema defined</p>
              <p className="text-sm">This test accepts free-form input</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Schema */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expected Output Schema</CardTitle>
              <CardDescription>
                Structure of expected response format
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(renderSchema(test.expected_output_schema), 'output')}
            >
              {copiedOutput ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {test.expected_output_schema ? (
            <>
              {/* Visual representation */}
              {renderSchemaProperties(test.expected_output_schema)}
              
              {/* Raw JSON */}
              <div>
                <h4 className="font-medium mb-2">Raw Schema</h4>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {renderSchema(test.expected_output_schema)}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No output schema defined</p>
              <p className="text-sm">This test accepts free-form output</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Configuration */}
      {test.evaluation_config && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evaluation Configuration</CardTitle>
            <CardDescription>
              Settings used to evaluate responses for this test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(test.evaluation_config).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">{key.replace(/_/g, ' ')}</span>
                  <code className="text-sm">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Example Usage */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Example Usage</CardTitle>
          <CardDescription>
            How to structure your API request for this test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
{`// Example API request
POST /api/v1/tests/${test.id}/run
{
  "model_ids": ["gpt-4-turbo", "claude-3-opus"],
  "input_data": ${test.input_schema ? JSON.stringify({
    // Based on input schema
    ...Object.fromEntries(
      Object.entries(test.input_schema.properties || {}).map(([key, prop]: [string, any]) => [
        key, 
        prop.type === 'string' ? 'example value' : 
        prop.type === 'number' ? 42 : 
        prop.type === 'boolean' ? true : 'example'
      ])
    )
  }, null, 2) : '{\n    // Free-form input\n    "prompt": "Your test input here"\n  }'}
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
